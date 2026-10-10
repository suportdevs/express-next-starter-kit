import type { Express, Router } from 'express';
import type { Hooks } from './hooks';
import type { Logger } from 'pino';

export interface ModuleContext {
  app: Express;
  hooks: Hooks;
  logger: Logger;
}

export interface ApiModule {
  /** Unique module name — must match the folder name and the CLI module id. */
  name: string;
  /** Express router mounted at `/api/<basePath>`. */
  router?: Router;
  /** Defaults to the module name. */
  basePath?: string;
  /** Runs once at startup before routes are mounted. Register hooks here. */
  setup?: (ctx: ModuleContext) => void | Promise<void>;
}

export const defineModule = (mod: ApiModule): ApiModule => mod;
