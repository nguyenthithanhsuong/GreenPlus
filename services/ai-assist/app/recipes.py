from .schemas import RecipeRequest

RECIPES = [
    ("Canh rau củ", ("cà rốt", "khoai tây", "rau", "hành"), ("Rửa và cắt rau củ", "Đun sôi nước, cho củ vào trước", "Nêm vừa ăn và thêm rau sau")),
    ("Rau xào tỏi", ("rau", "tỏi", "dầu ăn"), ("Rửa rau và để ráo", "Phi tỏi với một ít dầu", "Xào rau nhanh ở lửa vừa")),
    ("Salad tươi", ("xà lách", "cà chua", "dưa leo"), ("Rửa sạch nguyên liệu", "Cắt nhỏ rau củ", "Trộn và dùng ngay")),
    ("Cháo bí đỏ", ("bí đỏ", "gạo", "nước"), ("Vo gạo và cắt bí đỏ", "Nấu cháo cho mềm", "Nghiền bí và trộn đều")),
    ("Canh bí", ("bí", "hành", "nước"), ("Sơ chế bí", "Đun sôi nước rồi thêm bí", "Nêm và nấu đến khi bí mềm")),
]

def suggest(body: RecipeRequest):
    selected = {value.strip().casefold() for value in body.ingredients if value.strip()}
    ranked = []
    for name, ingredients, steps in RECIPES:
        matched = [value for value in ingredients if any(value in chosen or chosen in value for chosen in selected)]
        missing = [value for value in ingredients if value not in matched]
        ranked.append({"name": name, "ingredients": list(ingredients), "steps": list(steps),
                       "matched_ingredients": matched, "missing_ingredients": missing,
                       "servings": body.servings, "match_ratio": round(len(matched) / len(ingredients), 2),
                       "mode": "curated_recipe_matching"})
    ranked.sort(key=lambda item: (-item["match_ratio"], len(item["missing_ingredients"])))
    return {"recipes": ranked[:3], "notice": "Công thức gợi ý; kiểm tra dị ứng và chế độ ăn trước khi sử dụng.",
            "restrictions": body.restrictions, "mode": "curated_recipe_matching"}
