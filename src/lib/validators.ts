export function validarEAN13(codigo: string): boolean {
  // Remover espaços e caracteres especiais
  const codigoLimpo = codigo.replace(/\D/g, "");

  // Verificar se tem 13 dígitos
  if (codigoLimpo.length !== 13) return false;

  // Verificar se são apenas números
  if (!/^\d+$/.test(codigoLimpo)) return false;

  // Calcular dígito verificador
  const digitos = codigoLimpo.split("").map(Number);
  const digitoVerificador = digitos[12];

  let soma = 0;
  for (let i = 0; i < 12; i++) {
    soma += digitos[i] * (i % 2 === 0 ? 1 : 3);
  }

  const resto = soma % 10;
  const digitoCalculado = resto === 0 ? 0 : 10 - resto;

  return digitoCalculado === digitoVerificador;
}
