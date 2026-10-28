declare module "express-mysql-session" {
  import type session from "express-session";

  interface MySQLSessionOptions {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    createDatabaseTable?: boolean;
    clearExpired?: boolean;
    checkExpirationInterval?: number;
  }

  class MySQLStore extends session.Store {
    constructor(options?: MySQLSessionOptions);
  }

  function createMySQLStore(sessionModule: typeof import("express-session")): typeof MySQLStore;

  export = createMySQLStore;
}
