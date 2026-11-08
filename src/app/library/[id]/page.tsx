import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecipeView } from "@/components/recipes/RecipeView";
import { libraryRecipes, recipeById } from "@/domain/recipes/library";

export function generateStaticParams() {
  return libraryRecipes().map((r) => ({ id: r.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const r = recipeById(id);
  return { title: r ? `${r.title} · Preppy` : "Recipe · Preppy" };
}

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = recipeById(id);
  if (!r) notFound();
  return <RecipeView recipe={r} />;
}
