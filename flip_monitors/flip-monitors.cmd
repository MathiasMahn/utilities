<# : Batch launcher: runs the PowerShell code below, so this file can be double-clicked.
@echo off
powershell -NoProfile -ExecutionPolicy Bypass -Command "iex (Get-Content -LiteralPath '%~f0' -Raw)"
if errorlevel 1 pause
exit /b
#>

# Flips the monitor arrangement left-to-right.
# The primary monitor stays primary; only the monitor positions change.

Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;

public static class DisplayFlip
{
    const int ENUM_CURRENT_SETTINGS = -1;
    const int ATTACHED_TO_DESKTOP = 0x1;
    const int PRIMARY_DEVICE = 0x4;
    const int MIRRORING_DRIVER = 0x8;
    const uint DM_POSITION = 0x20;
    const uint CDS_UPDATEREGISTRY = 0x1;
    const uint CDS_NORESET = 0x10000000;

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    struct DISPLAY_DEVICE
    {
        public int cb;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)] public string DeviceName;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 128)] public string DeviceString;
        public int StateFlags;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 128)] public string DeviceID;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 128)] public string DeviceKey;
    }

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    struct DEVMODE
    {
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)] public string dmDeviceName;
        public ushort dmSpecVersion;
        public ushort dmDriverVersion;
        public ushort dmSize;
        public ushort dmDriverExtra;
        public uint dmFields;
        public int dmPositionX;
        public int dmPositionY;
        public uint dmDisplayOrientation;
        public uint dmDisplayFixedOutput;
        public short dmColor;
        public short dmDuplex;
        public short dmYResolution;
        public short dmTTOption;
        public short dmCollate;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)] public string dmFormName;
        public ushort dmLogPixels;
        public uint dmBitsPerPel;
        public uint dmPelsWidth;
        public uint dmPelsHeight;
        public uint dmDisplayFlags;
        public uint dmDisplayFrequency;
        public uint dmICMMethod;
        public uint dmICMIntent;
        public uint dmMediaType;
        public uint dmDitherType;
        public uint dmReserved1;
        public uint dmReserved2;
        public uint dmPanningWidth;
        public uint dmPanningHeight;
    }

    class Screen
    {
        public string Name;
        public bool Primary;
        public DEVMODE Mode;
    }

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    static extern bool EnumDisplayDevices(string device, uint index, ref DISPLAY_DEVICE info, uint flags);

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    static extern bool EnumDisplaySettings(string device, int mode, ref DEVMODE info);

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    static extern int ChangeDisplaySettingsEx(string device, ref DEVMODE mode, IntPtr hwnd, uint flags, IntPtr param);

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    static extern int ChangeDisplaySettingsEx(string device, IntPtr mode, IntPtr hwnd, uint flags, IntPtr param);

    [DllImport("user32.dll")]
    static extern IntPtr SetThreadDpiAwarenessContext(IntPtr context);

    public static void Flip()
    {
        // Per-monitor DPI awareness, so scaled displays report their real pixel sizes.
        SetThreadDpiAwarenessContext(new IntPtr(-4));

        var screens = new List<Screen>();
        var device = new DISPLAY_DEVICE();
        device.cb = Marshal.SizeOf(typeof(DISPLAY_DEVICE));

        for (uint i = 0; EnumDisplayDevices(null, i, ref device, 0); i++)
        {
            if ((device.StateFlags & ATTACHED_TO_DESKTOP) == 0) continue;
            if ((device.StateFlags & MIRRORING_DRIVER) != 0) continue;

            var mode = new DEVMODE();
            mode.dmSize = (ushort)Marshal.SizeOf(typeof(DEVMODE));
            if (!EnumDisplaySettings(device.DeviceName, ENUM_CURRENT_SETTINGS, ref mode)) continue;

            var screen = new Screen();
            screen.Name = device.DeviceName;
            screen.Primary = (device.StateFlags & PRIMARY_DEVICE) != 0;
            screen.Mode = mode;
            screens.Add(screen);
        }

        if (screens.Count < 2)
            throw new InvalidOperationException("Found fewer than two active monitors, so there is nothing to flip.");

        Screen primary = screens.Find(s => s.Primary);
        if (primary == null)
            throw new InvalidOperationException("Could not identify the primary monitor.");

        // Mirror around the primary monitor, which has to stay at position 0,0.
        int primaryWidth = (int)primary.Mode.dmPelsWidth;

        foreach (Screen screen in screens)
        {
            if (screen.Primary) continue;

            screen.Mode.dmPositionX = primaryWidth - (screen.Mode.dmPositionX + (int)screen.Mode.dmPelsWidth);
            screen.Mode.dmFields = DM_POSITION;

            int stageResult = ChangeDisplaySettingsEx(screen.Name, ref screen.Mode, IntPtr.Zero,
                CDS_UPDATEREGISTRY | CDS_NORESET, IntPtr.Zero);
            if (stageResult != 0)
                throw new InvalidOperationException("Windows rejected the new position for " + screen.Name + " (code " + stageResult + ").");
        }

        // Apply all the staged changes together.
        int applyResult = ChangeDisplaySettingsEx(null, IntPtr.Zero, IntPtr.Zero, 0, IntPtr.Zero);
        if (applyResult != 0)
            throw new InvalidOperationException("Windows could not apply the new layout (code " + applyResult + ").");
    }
}
'@

try {
    [DisplayFlip]::Flip()
    Write-Host 'Monitors flipped.'
} catch {
    Write-Host "Could not flip monitors: $($_.Exception.GetBaseException().Message)"
    exit 1
}
