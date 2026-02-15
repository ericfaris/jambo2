import type { PendingResolution } from '../engine/types.ts';

interface PlayDisabledReasonInput {
  phase: 'DRAW' | 'PLAY' | 'GAME_OVER';
  currentPlayer: 0 | 1;
  actionsLeft: number;
  hasPendingInteraction: boolean;
  isAiTurn: boolean;
}

interface DrawDisabledReasonInput {
  phase: 'DRAW' | 'PLAY' | 'GAME_OVER';
  currentPlayer: 0 | 1;
  isAiTurn: boolean;
}

export function getPlayDisabledReason(input: PlayDisabledReasonInput): string | null {
  if (input.phase !== 'PLAY') return 'Play cards during the Play phase.';
  if (input.currentPlayer !== 0) return "Wait for your turn to play cards.";
  if (input.isAiTurn) return 'Opponent is resolving actions.';
  if (input.hasPendingInteraction) return 'Finish the current interaction first.';
  if (input.actionsLeft <= 0) return 'No actions remaining this turn.';
  return null;
}

export function getDrawDisabledReason(input: DrawDisabledReasonInput): string | null {
  if (input.phase !== 'DRAW') return 'Drawing is only available during the Draw phase.';
  if (input.currentPlayer !== 0) return "Wait for your turn to draw.";
  if (input.isAiTurn) return 'Opponent is resolving actions.';
  return null;
}

export function formatResolutionBreadcrumb(pr: PendingResolution): string {
  switch (pr.type) {
    case 'WARE_THEFT_SWAP':
      return `Parrot Swap > ${pr.step === 'STEAL' ? 'Steal Ware' : 'Give Ware'}`;
    case 'HAND_SWAP':
      return `Hyena > ${pr.step === 'TAKE' ? 'Take Card' : 'Give Card'}`;
    case 'OPPONENT_DISCARD':
      return `Tribal Elder > Opponent Discard to ${pr.discardTo}`;
    case 'WARE_CASH_CONVERSION':
      return `Dancer > ${pr.step === 'SELECT_CARD' ? 'Select Ware Card' : 'Select 3 Wares'}`;
    case 'UTILITY_KEEP':
      return `Snake > ${pr.step === 'ACTIVE_CHOOSE' ? 'Active Chooses Keep' : 'Opponent Chooses Keep'}`;
    case 'CROCODILE_USE':
      return `Crocodile > ${pr.step === 'SELECT_UTILITY' ? 'Select Utility' : 'Resolve Utility'}`;
    case 'UTILITY_EFFECT':
      return `Utility > ${pr.utilityDesign} > ${pr.step}`;
    case 'AUCTION':
      return `Auction > ${pr.wares.length < 2 ? 'Select Wares' : 'Bidding'}`;
    default:
      return pr.type.replace(/_/g, ' > ');
  }
}
