import { asc, eq } from 'drizzle-orm';
import { db } from './index';
import { themes, type ThemeRow } from './schema';

/** All themes, ordered for stable display in the public picker and admin list. */
export async function getThemes(): Promise<ThemeRow[]> {
  return db.select().from(themes).orderBy(asc(themes.sort), asc(themes.id));
}

export type NewTheme = {
  name: string;
  bg: string;
  line: string;
  ink: string;
  sort?: number;
};

export async function createTheme(theme: NewTheme): Promise<void> {
  await db.insert(themes).values(theme);
}

export async function updateTheme(id: number, theme: Partial<NewTheme>): Promise<void> {
  await db.update(themes).set(theme).where(eq(themes.id, id));
}

export async function deleteTheme(id: number): Promise<void> {
  await db.delete(themes).where(eq(themes.id, id));
}
