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

## Compatibility

| Field | Value |
|-------|-------|
| **Plugin** | `dsh-wsl-glab` **0.1.0** |
| **Minimum dsh** | ≥ **0.1.2** (web UI one-shot `?token=` on Windows relay `:3081`) |
| **Latest verified** | See [dsh-wsl-kit Compatibility](https://github.com/173787247/dsh-wsl-kit#compatibility-2026-09) (currently **`0.1.7-alpha.2`**) — single source of truth for the suite |
| **Kit set** | optional (not in `install.sh` / `KIT_SET=daily` by default) |

## License

MIT
