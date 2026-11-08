import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, ScreenHeader, Stack } from "@/components/ui/Layout";

/** Honest placeholder for a tab whose screens move over in a later slice. */
export function ComingSoon({ title, body }: { title: string; body: string }) {
  return (
    <Stack gap={6}>
      <ScreenHeader title={title} />
      <EmptyState
        title="Moving over next"
        body={body}
        action={
          <ButtonLink href="/library" variant="secondary" size="sm">
            Browse your library
          </ButtonLink>
        }
      />
    </Stack>
  );
}
