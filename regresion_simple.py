# Regresión lineal simple · Aula Digital Pangoa
# Python 3. Datos ficticios; sin bibliotecas externas.
x = [1,2,3,4,5,6]
y = [2,4,5,4,5,7]

# 1. Calcular las medias de entrenamiento
x_media = sum(x) / len(x)
y_media = sum(y) / len(y)

# 2. Ajustar la recta por mínimos cuadrados
numerador = sum((xi - x_media) * (yi - y_media)
                for xi, yi in zip(x, y))
denominador = sum((xi - x_media) ** 2 for xi in x)
if denominador == 0:
    raise ValueError("Las entradas deben variar")
b1 = numerador / denominador
b0 = y_media - b1 * x_media

# 3. Predecir un nuevo valor
def predecir(horas):
    return b0 + b1 * horas

horas = 4.0
print(f"Modelo: y = {b0:.3f} + ({b1:.3f}) * x")
print(f"Predicción: {predecir(horas):.2f} ejercicios")

# 4. Evaluar con datos de prueba separados
x_prueba = [1.5, 3.5, 5.5]
y_prueba = [3, 4, 6]
mae = sum(abs(predecir(xi) - yi)
          for xi, yi in zip(x_prueba, y_prueba)) / len(x_prueba)
print(f"Error absoluto medio de prueba (MAE): {mae:.3f}")
# Menor MAE significa menor error en estos datos de prueba.
# Este ejemplo pequeño no garantiza resultados reales.
