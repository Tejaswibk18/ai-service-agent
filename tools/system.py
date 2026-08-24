import json

from config.server import (
    SERVER_HOST,
    SERVER_USERNAME,
    SERVER_PASSWORD,
    SERVER_PEM_KEY,
)

from tools.ssh import ssh_execute


def run_command(command: str):
    return ssh_execute(
        host=SERVER_HOST,
        username=SERVER_USERNAME,
        command=command,
        password=SERVER_PASSWORD or None,
        pem_key_path=SERVER_PEM_KEY or None,
    )


def collect_server_health():
    """
    Collects structured health information from a Linux or Windows server.
    """

    # --------------------------------------------------
    # Linux
    # --------------------------------------------------

    linux_command = r"""
python3 - <<'PY'
import json
import os
import platform
import shutil
import socket
import time

result = {
    "os": {
        "name": "Linux",
        "kernel": platform.release(),
        "hostname": socket.gethostname()
    },
    "uptime": {},
    "cpu": {},
    "memory": {},
    "disk": []
}

# -------------------------
# Uptime
# -------------------------

try:
    with open("/proc/uptime") as f:
        uptime_seconds = float(f.read().split()[0])

    result["uptime"] = {
        "seconds": uptime_seconds,
        "minutes": round(uptime_seconds / 60, 2),
        "hours": round(uptime_seconds / 3600, 2)
    }

except Exception as e:
    result["uptime"] = {
        "error": str(e)
    }


# -------------------------
# CPU
# -------------------------

try:
    cpu_count = os.cpu_count()

    load_1, load_5, load_15 = os.getloadavg()

    result["cpu"] = {
        "logical_cpus": cpu_count,
        "load_average": {
            "1_min": load_1,
            "5_min": load_5,
            "15_min": load_15
        }
    }

except Exception as e:
    result["cpu"] = {
        "error": str(e)
    }


# -------------------------
# Memory
# -------------------------

try:
    with open("/proc/meminfo") as f:
        meminfo = {}

        for line in f:
            key, value = line.split(":", 1)
            value = value.strip().split()[0]
            meminfo[key] = int(value)

    total = meminfo.get("MemTotal", 0)
    available = meminfo.get("MemAvailable", 0)
    used = total - available

    result["memory"] = {
        "total_mb": round(total / 1024, 2),
        "available_mb": round(available / 1024, 2),
        "used_mb": round(used / 1024, 2),
        "usage_percent": round(
            (used / total) * 100, 2
        ) if total else 0
    }

except Exception as e:
    result["memory"] = {
        "error": str(e)
    }


# -------------------------
# Disk
# -------------------------

try:
    for partition in ["/", "/boot", "/boot/efi"]:

        if os.path.exists(partition):

            usage = shutil.disk_usage(partition)

            result["disk"].append({
                "mount": partition,
                "total_gb": round(
                    usage.total / (1024 ** 3), 2
                ),
                "used_gb": round(
                    usage.used / (1024 ** 3), 2
                ),
                "free_gb": round(
                    usage.free / (1024 ** 3), 2
                ),
                "usage_percent": round(
                    (usage.used / usage.total) * 100,
                    2
                )
            })

except Exception as e:
    result["disk"] = {
        "error": str(e)
    }


print(json.dumps(result))
PY
"""

    linux_result = run_command(linux_command)

    if linux_result["success"]:

        try:

            data = json.loads(
                linux_result["output"]
            )

            return {
                "success": True,
                "data": data
            }

        except json.JSONDecodeError:
            pass


    # --------------------------------------------------
    # Windows
    # --------------------------------------------------

    windows_command = r'''
powershell -Command "
\$os = Get-CimInstance Win32_OperatingSystem;
\$cpu = Get-CimInstance Win32_Processor;
\$disks = Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=3';

\$totalMemory = [double]\$os.TotalVisibleMemorySize;
\$freeMemory = [double]\$os.FreePhysicalMemory;
\$usedMemory = \$totalMemory - \$freeMemory;

\$result = @{
    os = @{
        name = 'Windows';
        version = \$os.Version;
        hostname = \$env:COMPUTERNAME;
    };

    uptime = @{
        last_boot = \$os.LastBootUpTime;
    };

    cpu = @{
        logical_cpus = \$cpu.NumberOfLogicalProcessors;
        cores = \$cpu.NumberOfCores;
        usage_percent = \$cpu.LoadPercentage;
    };

    memory = @{
        total_mb = [math]::Round(\$totalMemory / 1024, 2);
        available_mb = [math]::Round(\$freeMemory / 1024, 2);
        used_mb = [math]::Round(\$usedMemory / 1024, 2);
        usage_percent = [math]::Round((\$usedMemory / \$totalMemory) * 100, 2);
    };

    disk = @(
        \$disks | ForEach-Object {
            @{
                drive = \$_.DeviceID;
                total_gb = [math]::Round(\$_.Size / 1GB, 2);
                free_gb = [math]::Round(\$_.FreeSpace / 1GB, 2);
                usage_percent = [math]::Round((1 - (\$_.FreeSpace / \$_.Size)) * 100, 2);
            }
        }
    );
};

\$result | ConvertTo-Json -Depth 5 -Compress;
"
'''

    windows_result = run_command(
        windows_command
    )

    if windows_result["success"]:

        try:

            data = json.loads(
                windows_result["output"]
            )

            return {
                "success": True,
                "data": data
            }

        except json.JSONDecodeError:
            pass


    return {
        "success": False,
        "error": (
            linux_result.get("error")
            or windows_result.get("error")
            or "Unable to collect server health"
        )
    }