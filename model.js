/* Least-squares model shared by the interactive teaching controls. */
(function (root) {
  'use strict';
  function fit(xs, ys) {
    if (xs.length !== ys.length || xs.length < 2 || !xs.concat(ys).every(Number.isFinite)) {
      throw new Error('Se necesitan al menos dos pares de números válidos.');
    }
    const meanX = xs.reduce((a, b) => a + b, 0) / xs.length;
    const meanY = ys.reduce((a, b) => a + b, 0) / ys.length;
    const variance = xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0);
    if (!variance) throw new Error('Las horas deben tener al menos dos valores distintos.');
    const slope = xs.reduce((sum, x, i) => sum + (x - meanX) * (ys[i] - meanY), 0) / variance;
    return { slope, intercept: meanY - slope * meanX };
  }
  function predict(model, x) { return model.intercept + model.slope * x; }
  function mae(model, xs, ys) {
    if (xs.length !== ys.length || !xs.length) throw new Error('Datos de prueba no válidos.');
    return xs.reduce((sum, x, i) => sum + Math.abs(predict(model, x) - ys[i]), 0) / xs.length;
  }
  function python(xs, ys, hour) {
    return `# Regresión lineal simple · Aula Digital Pangoa
# Python 3. Datos ficticios; sin bibliotecas externas.
x = ${JSON.stringify(xs)}
y = ${JSON.stringify(ys)}

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

horas = ${Number(hour).toFixed(1)}
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
`;
  }
  const api = { fit, predict, mae, python };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LinearModel = api;
})(typeof window !== 'undefined' ? window : globalThis);
