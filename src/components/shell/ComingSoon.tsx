import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, ScreenHeader, Stack } from "@/components/ui/Layout";

/** Placeholder for a tab that isn't built yet. */
export function ComingSoon({ title, body }: { title: string; body: string }) {
  return (
    <Stack gap={6}>
      <ScreenHeader title={title} />
      <EmptyState
        title="Coming soon"
        body={body}
        action={
          <ButtonLink href="/library" variant="secondary" size="sm">
            Browse recipes
          </ButtonLink>
        }
      />
    </Stack>
  );
}
