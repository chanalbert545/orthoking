export function findPromotionForVariant(promotions, product, variant) {
  return promotions.find((promotion) => {
    if (promotion.variantId && promotion.variantId !== variant.id) return false;
    if (promotion.allProducts) return true;

    const categoryIds = promotion.categoryIds?.length
      ? promotion.categoryIds
      : promotion.categoryId ? [promotion.categoryId] : [];
    if (categoryIds.length) return categoryIds.includes(product.categoryId);

    return promotion.productIds?.includes(product.id) || promotion.productId === product.id;
  }) || null;
}

export function calculatePromotionPrice(variant, promotion) {
  if (!promotion) {
    return { currentPriceUgx: variant.regularPriceUgx, discountUgx: 0 };
  }

  const priceBaseUgx = promotion.discountType === "percent"
    ? variant.formerPriceUgx ?? variant.regularPriceUgx
    : variant.regularPriceUgx;
  const discountUgx = promotion.discountType === "percent"
    ? Math.floor((priceBaseUgx * promotion.percent) / 100)
    : promotion.amountUgx || 0;

  return {
    currentPriceUgx: Math.max(0, priceBaseUgx - discountUgx),
    discountUgx,
  };
}