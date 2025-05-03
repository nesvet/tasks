import type { Task } from "./Task";


/* eslint-disable @typescript-eslint/no-explicit-any */


export type Options = {
	verbose?: boolean;
};

export type Glossary = Record<string, typeof Task<any>>;

export type ValueInstance<G extends Glossary> = InstanceType<G[keyof G]>;
