import paramiko


def ssh_execute(
    server,
    command: str
):
    ssh = paramiko.SSHClient()

    ssh.set_missing_host_key_policy(
        paramiko.AutoAddPolicy()
    )

    try:

        auth_type = server["auth_type"]

        if auth_type == "pem":

            private_key = paramiko.RSAKey.from_private_key_file(
                server["pem_key"]
            )

            ssh.connect(
                hostname=server["host"],
                username=server["username"],
                pkey=private_key,
                timeout=10
            )

        elif auth_type == "password":

            ssh.connect(
                hostname=server["host"],
                username=server["username"],
                password=server["password"],
                timeout=10
            )

        else:

            raise ValueError(
                f"Unsupported authentication type: {auth_type}"
            )

        stdin, stdout, stderr = ssh.exec_command(
            command
        )

        output = stdout.read().decode().strip()
        error = stderr.read().decode().strip()

        return {
            "success": True,
            "output": output,
            "error": error
        }

    except Exception as exc:

        return {
            "success": False,
            "output": "",
            "error": str(exc)
        }

    finally:

        ssh.close()