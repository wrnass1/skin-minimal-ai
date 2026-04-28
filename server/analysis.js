const riskLabelByScore = (score) => (score >= 70 ? "Повышенный" : score >= 50 ? "Средний" : "Низкий");

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hasAnyActives(product) {
  const actives = product.actives ?? [];
  return actives.some((active) => ["bha", "aha", "retinoid", "bp", "vitc"].includes(active));
}

function countStrongActives(products) {
  return products.filter((p) => hasAnyActives(p)).length;
}

function routineHasCategory(products, category) {
  return products.some((p) => p.category === category);
}

export function runAnalysis({ skinTypeId, symptomIds, products }) {
  const symptoms = new Set(symptomIds ?? []);
  const strongActivesCount = countStrongActives(products);
  const hasSunscreen = routineHasCategory(products, "sunscreen");
  const hasMoisturizer = routineHasCategory(products, "moisturizer");
  const hasGentleCleanser = routineHasCategory(products, "cleanser");

  const base = 34;

  const skinTypeBoost =
    skinTypeId === "sensitive"
      ? 14
      : skinTypeId === "dry"
        ? 10
        : skinTypeId === "combo"
          ? 7
          : skinTypeId === "oily"
            ? 6
            : 8;

  const symptomBoost =
    (symptoms.has("redness") ? 12 : 0) +
    (symptoms.has("dryness") ? 10 : 0) +
    (symptoms.has("flaking") ? 8 : 0) +
    (symptoms.has("tightness") ? 8 : 0) +
    (symptoms.has("acne") ? 6 : 0);

  const activesBoost = strongActivesCount === 0 ? 0 : strongActivesCount === 1 ? 10 : strongActivesCount === 2 ? 18 : 24;

  const comboIrritation = symptoms.has("redness") && (symptoms.has("dryness") || symptoms.has("tightness") || symptoms.has("flaking"));
  const barrierBoost = comboIrritation && strongActivesCount > 0 ? 10 : 0;

  const missingBasicsBoost =
    (!hasMoisturizer ? 7 : 0) + (!hasSunscreen && strongActivesCount > 0 ? 8 : 0) + (!hasGentleCleanser ? 3 : 0);

  const rawScore = base + skinTypeBoost + symptomBoost + activesBoost + barrierBoost + missingBasicsBoost;
  const riskScore = clamp(rawScore, 20, 95);
  const riskLabel = riskLabelByScore(riskScore);

  const pause = products.filter((p) => hasAnyActives(p));
  const keep = products.filter((p) => !pause.some((paused) => paused.id === p.id));

  const summary = (() => {
    if (riskScore >= 70) {
      return "Есть признаки раздражения и перегрузки активами. Вероятно, кожный барьер сейчас нуждается в паузе и восстановлении.";
    }
    if (riskScore >= 50) {
      return "Рутина в целом ок, но есть факторы, которые могут усиливать чувствительность. Лучше упростить уход и снизить нагрузку активами.";
    }
    return "Рутина выглядит достаточно стабильной. Держите фокус на базовых шагах и аккуратной дозировке активов.";
  })();

  const recommendation = (() => {
    if (riskScore >= 70) {
      const basePlan = "Уберите сильные активы на 10–14 дней. Оставьте мягкое очищение, базовый крем и SPF.";
      if (skinTypeId === "dry") return `${basePlan} Для сухой кожи добавьте питание: более плотный крем/бальзам вечером.`;
      if (skinTypeId === "oily" || skinTypeId === "combo")
        return `${basePlan} Для жирной/комбинированной кожи выбирайте лёгкий увлажняющий крем без отдушек.`;
      return basePlan;
    }

    if (strongActivesCount > 0 && !hasSunscreen) {
      return "Если вы используете активы, обязательно добавьте ежедневный SPF. Без него риск раздражения и пигментации выше.";
    }

    if (skinTypeId === "dry") {
      return "Сухой коже чаще всего помогает усиление увлажнения и питания: мягкое очищение, более плотный крем, минимум активов.";
    }
    if (skinTypeId === "oily") {
      return "Жирной коже обычно лучше подходят лёгкие текстуры и аккуратные активы 2–3 раза в неделю, без пересушивания.";
    }
    if (skinTypeId === "combo") {
      return "Комбинированной коже важно балансировать: увлажнение + умеренные активы точечно и не ежедневно.";
    }
    return "Чувствительной коже лучше всего подходит минимализм и осторожная дозировка активов: 1–2 раза в неделю и только при хорошей переносимости.";
  })();

  // Minimal routine suggestions
  const suggestedKeep = [];
  const suggestedPause = [];

  const essentials = ["cleanser", "moisturizer", "sunscreen"];
  for (const category of essentials) {
    const existing = products.find((p) => p.category === category);
    if (existing) suggestedKeep.push(existing);
  }

  if (riskScore >= 70) {
    suggestedPause.push(...pause);
  } else if (riskScore >= 50) {
    // pause only the harshest actives, keep barrier-friendly actives like niacinamide
    const harsh = pause.filter((p) => (p.actives ?? []).some((a) => ["bha", "aha", "retinoid", "bp"].includes(a)));
    suggestedPause.push(...harsh);
  }

  const finalKeep = suggestedKeep.length ? uniqueById(suggestedKeep) : keep;
  const finalPause = suggestedPause.length ? uniqueById(suggestedPause) : pause;

  return {
    riskScore,
    riskLabel,
    summary,
    recommendation,
    keep: finalKeep.map(toMinimalProduct),
    pause: finalPause.map(toMinimalProduct),
  };
}

function uniqueById(items) {
  const map = new Map();
  for (const item of items) map.set(item.id, item);
  return Array.from(map.values());
}

function toMinimalProduct(product) {
  return {
    id: product.id,
    name: product.name,
    schedule: product.schedule,
    icon: product.icon,
    tone: product.tone,
    category: product.category,
    actives: product.actives ?? [],
  };
}

