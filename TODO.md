# Fix ProductCard Wishlist Icon Flash Issue

## Approved Plan Steps:
- [x] Step 1: Update WishlistContext.tsx for user-specific localStorage to prevent init mismatch, expose loading properly.
- [x] Step 2: Update ProductCard.tsx - removed conditional loading opacity to ensure always visible, style only on state.
- [ ] Step 3: Test, git commit, create PR.

