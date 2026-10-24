import type { TutorialState } from '../types/index.ts'

export function tutorialContinueBlock(tutorial: Pick<TutorialState, 'step' | 'inspectedLink' | 'selectedPages' | 'revealedCheckout'>) {
  if (tutorial.step === 3 && !tutorial.inspectedLink) return 'Inspect the broken link before continuing.'
  if (tutorial.step === 4 && tutorial.selectedPages.length === 0) return 'Select at least one page.'
  if (tutorial.step === 6 && !tutorial.revealedCheckout) return 'Reveal the checkout result before continuing.'
  return ''
}
