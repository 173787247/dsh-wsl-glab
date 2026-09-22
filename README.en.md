# dsh-wsl-glab

> **Languages:** [中文（首页）](./README.md) · **English** (this file)

Read-only glab MR/issue/ci status.

| | |
|---|---|
| Version | **0.1.0** |
| Kit | Optional companion to [dsh-wsl-kit](https://github.com/173787247/dsh-wsl-kit); not in `install.sh` |

## Install

```sh
dsh plugin --profile web add github:173787247/dsh-wsl-glab
```

Batch link (optional): `bash dsh-wsl-kit/scripts/link-linux-plugins.sh`

## Tools

| Tool | Role |
|------|------|
| `glab_status` | glab version |
| `glab_mr_list` | MR list |
| `glab_issue_list` | issue list |
| `glab_ci_status` | ci status |

## Config

`timeoutMs`

No create/merge. Auth via glab config. Complements `dsh-wsl-github`.

## License

MIT
