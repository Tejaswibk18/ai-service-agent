import paramiko


def ssh_execute(
    host: str,
    username: str,
    command: str,
    password: str | None = None,
    pem_key_path: str | None = None,
):
    ssh = paramiko.SSHClient()

    ssh.set_missing_host_key_policy(
        paramiko.AutoAddPolicy()
    )

    try:

        if pem_key_path:

            private_key = paramiko.RSAKey.from_private_key_file(
                pem_key_path
            )

            ssh.connect(
                hostname=host,
                username=username,
                pkey=private_key,
                timeout=10,
            )

        elif password:

            ssh.connect(
                hostname=host,
                username=username,
                password=password,
                timeout=10,
            )

        else:

            raise ValueError(
                "Password or PEM key is required."
            )

        stdin, stdout, stderr = ssh.exec_command(command)

        output = stdout.read().decode().strip()
        error = stderr.read().decode().strip()

        return {
            "success": True,
            "output": output,
            "error": error,
        }

    except Exception as exc:

        return {
            "success": False,
            "output": "",
            "error": str(exc),
        }

    finally:

        ssh.close()