// Attachment for a screen with a detail panel:
// calls set(id) when you point at or click an element with data-cid.
export const cardHover = set => el => {
  const on = e => { const t = e.target.closest('[data-cid]'); if (t) set(+t.dataset.cid); };
  el.addEventListener('mouseover', on);
  el.addEventListener('click', on);
  return () => { el.removeEventListener('mouseover', on); el.removeEventListener('click', on); };
};
