# Conectarse a la base de datos desde VSCode

## Extensión recomendada: SQLTools

Instala las dos extensiones siguientes desde el panel de extensiones de VSCode:

- **SQLTools** — `mtxr.sqltools`
- **SQLTools PostgreSQL/Cockroach Driver** — `mtxr.sqltools-driver-pg`

---

## Configuración de la conexión

Con el contenedor corriendo (`docker compose up db backend`), abre SQLTools
y crea una nueva conexión con estos datos:

| Campo       | Valor           |
|-------------|-----------------|
| Driver      | PostgreSQL      |
| Host        | `localhost`     |
| Port        | `5432`          |
| Database    | `rxpanel`       |
| Username    | `rxpanel_dba`   |
| Password    | `rxpanel_pass`  |

> El host es `localhost` porque el puerto 5432 del contenedor está
> expuesto en tu máquina. Dentro de Docker el host sería `db`.

---

## Pasos

1. Abre la paleta de comandos → `SQLTools: New Connection`
2. Selecciona **PostgreSQL**
3. Rellena los campos de la tabla de arriba
4. Clic en **Test Connection** → debe mostrar `Connected`
5. Clic en **Save Connection**

Una vez conectado puedes explorar tablas, ejecutar queries y ver datos
directamente desde el panel lateral de SQLTools.

---

## Extensión alternativa: Database Client

Si prefieres una interfaz más visual, instala:

- **Database Client** — `cweijan.vscode-database-client2`

Los datos de conexión son los mismos. Esta extensión ofrece una vista
de árbol con tablas, índices y un editor de queries integrado.
