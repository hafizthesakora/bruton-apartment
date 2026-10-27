/** Money is stored as integer pesewas. */
export const toPesewas = (ghs: number) => Math.round(ghs * 100);
export const toCedis = (pesewas: number) => pesewas / 100;

export function formatGHS(pesewas: number) {
  return `GH₵ ${(pesewas / 100).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
