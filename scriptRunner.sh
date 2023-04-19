#!/bin/sh
node ./dist/migrate.js
node dist/bin/001-create-roles.js
node dist/bin/002-create-max-login-attempts.js
node dist/bin/009-create-role-rights.js
