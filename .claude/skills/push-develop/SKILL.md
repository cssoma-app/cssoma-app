---
name: push-develop
description: "Stage, commit, and push pending changes to origin develop. Shows the diff summary and drafts the commit message for approval before touching git state."
argument-hint: "[--no-pull]"
user-invocable: true
allowed-tools: Read, Bash, AskUserQuestion
model: sonnet
agent: devops-engineer
---

Cierra el loop de una tarea de desarrollo: sube lo pendiente a `origin/develop` con un solo comando. Nunca hace `git add -A` a ciegas ni commitea/pushea sin aprobación explícita del mensaje de commit.

## Phases
1. **Check branch** — `git branch --show-current`. Si no es `develop`, detenerse y preguntar (con `AskUserQuestion`) si cambiar a `develop`, hacer push de la rama actual en su lugar, o cancelar. Nunca asumir.
2. **Show pending changes** — `git status --porcelain` + `git diff --stat` (staged y unstaged). Si no hay cambios, informar y terminar sin tocar nada.
3. **Review before staging** — listar los archivos a incluir; si algo huele a secreto (`.env` real, claves, `appsettings*.json` con valores no placeholder) avisar antes de continuar. Esto es una capa extra: el hook `validate-commit.sh` ya bloquea patrones de secretos conocidos y archivos `.env` reales al hacer `git commit`.
4. **Draft commit message** — mensaje conciso (qué cambió y por qué, no changelog línea por línea) siguiendo el estilo de los commits recientes (`git log --oneline -10`). Presentarlo al usuario para aprobación antes de commitear.
5. **Stage + commit** — `git add <archivos específicos>` (nunca `-A` sin revisión), luego `git commit -m "<mensaje aprobado>"`.
6. **Sync before push** — salvo `--no-pull`, `git fetch origin develop` y `git pull --rebase origin develop`. Si hay conflictos, detenerse y mostrarlos; no resolver automáticamente sin aprobación.
7. **Push** — `git push origin develop` (agregar `-u` si no hay upstream configurado). `validate-push.sh` corre automáticamente y solo advierte (no bloquea) si la rama fuera `main`.
8. **Report** — hash del commit, archivos incluidos, y confirmación de que `origin/develop` quedó actualizado. Si algo falla (hook, conflicto, rechazo del push), reportar la causa exacta y dejar el árbol de trabajo tal como quedó, sin reintentos destructivos.

## Output
Un commit en `develop` pusheado a `origin/develop`, o una parada clara con el motivo (rama incorrecta, hook bloqueó el commit, conflicto de merge, push rechazado) sin dejar estado a medias.
