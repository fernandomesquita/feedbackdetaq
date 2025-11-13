# Instruções de Migração - Tabela Quesitos

Esta migração adiciona a tabela `quesitos` ao banco de dados.

## Arquivo de Migração
`drizzle/0005_create_quesitos.sql`

## Opção 1: Executar com Drizzle Kit (Automático)

```bash
# Instalar dependências (se necessário)
pnpm install

# Aplicar todas as migrações pendentes
pnpm drizzle-kit push
```

## Opção 2: Executar SQL Manualmente

Execute o SQL abaixo diretamente no seu banco MySQL:

```sql
CREATE TABLE `quesitos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`descricao` text,
	`ordem` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quesitos_id` PRIMARY KEY(`id`)
);

CREATE INDEX `user_idx` ON `quesitos` (`userId`);
CREATE INDEX `ordem_idx` ON `quesitos` (`ordem`);
CREATE INDEX `is_active_idx` ON `quesitos` (`isActive`);
```

## Opção 3: Via Linha de Comando MySQL

```bash
# Se você tiver acesso ao mysql CLI
mysql -u seu_usuario -p seu_banco < drizzle/0005_create_quesitos.sql

# Ou com DATABASE_URL
mysql $(echo $DATABASE_URL | sed 's/mysql:\/\///' | sed 's/@/ -h /' | sed 's/:/ -P /' | sed 's/\// /' | awk '{print "-u "$1" -P "$3" -h "$2" "$4}') < drizzle/0005_create_quesitos.sql
```

## Verificar se a migração foi aplicada

Execute no MySQL:

```sql
SHOW TABLES LIKE 'quesitos';
DESCRIBE quesitos;
```

Você deve ver a tabela `quesitos` com as colunas:
- id (int, PK, auto_increment)
- titulo (varchar 255)
- descricao (text, nullable)
- ordem (int, default 0)
- isActive (boolean, default true)
- userId (int)
- createdAt (timestamp)
- updatedAt (timestamp)

## Status

A migração já foi commitada no branch:
`claude/director-profile-questions-011CV589UzDQCfF6voYzgqBv`

Arquivos:
- ✅ `drizzle/0005_create_quesitos.sql` - SQL de migração
- ✅ `drizzle/meta/_journal.json` - Atualizado com nova entrada
