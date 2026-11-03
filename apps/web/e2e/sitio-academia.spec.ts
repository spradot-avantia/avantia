import { expect, test, type Page } from "@playwright/test";

// Pruebas que NO escriben en la base: layout móvil, accesibilidad básica y
// validaciones de formulario del sitio de la academia.

async function sinDesbordeHorizontal(page: Page) {
  const { scroll, ancho } = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    ancho: document.documentElement.clientWidth,
  }));
  expect(scroll, "no debe haber scroll horizontal").toBeLessThanOrEqual(ancho);
}

/** Todo control interactivo visible debe medir al menos 44 px de alto (excepto enlaces dentro de texto). */
async function objetivosTactiles(page: Page) {
  const chicos = await page.evaluate(() => {
    const out: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>("button, input:not([type=hidden]):not([type=checkbox]), select, .al-btn, .al-nav a, .fc-cta")) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.height < 43.5) out.push(`${el.tagName.toLowerCase()}.${el.className} "${(el.textContent ?? "").trim().slice(0, 30)}" ${Math.round(r.height)}px`);
    }
    return out;
  });
  expect(chicos, "objetivos táctiles < 44 px").toEqual([]);
}

for (const ruta of ["/", "/ingresar", "/registro", "/recuperar", "/terminos", "/privacidad"]) {
  test(`${ruta}: sin desborde y con objetivos táctiles`, async ({ page }) => {
    const res = await page.goto(ruta);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
    await sinDesbordeHorizontal(page);
    await objetivosTactiles(page);
  });
}

test("inicio: plantilla de la academia con acceso del alumno y sin marca Avantia", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Tu cuenta" }).getByRole("link", { name: "Ingresar" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/con la tecnología de|powered by avantia/i);
});

test("pantallas del alumno: cabecera con la marca de la academia y accesos", async ({ page }) => {
  await page.goto("/ingresar");
  await expect(page.getByRole("link", { name: /inicio/i }).first()).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Crear cuenta" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/con la tecnología de|powered by avantia/i);
});

test("registro: valida campos vacíos con mensajes claros", async ({ page }) => {
  await page.goto("/registro");
  await page.getByRole("button", { name: "Crear mi cuenta" }).click();
  await expect(page.getByText("Escribe tu nombre y apellido.")).toBeVisible();
  await expect(page.getByText(/Escribe tu correo|Revisa tu correo/).first()).toBeVisible();
  await expect(page.getByText(/aceptas los términos/)).toBeVisible();
});

test("registro: contraseña corta y términos enlazan a la academia", async ({ page }) => {
  await page.goto("/registro");
  await page.getByLabel("Nombre y apellido").fill("Camila Rojas");
  await page.getByLabel("Correo").fill("camila@example.com");
  await page.getByLabel("Contraseña").fill("corta");
  await page.getByRole("button", { name: "Crear mi cuenta" }).click();
  await expect(page.getByText(/muy corta/)).toBeVisible();
  const href = await page.getByRole("link", { name: "términos", exact: true }).getAttribute("href");
  expect(href).toBe("/terminos");
});

test("ingreso: credenciales inválidas dan un mensaje que no revela si el correo existe", async ({ page }) => {
  await page.goto("/ingresar");
  await page.getByLabel("Correo").fill("nadie-existe@example.com");
  await page.getByLabel("Contraseña").fill("cualquier-clave-larga");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page.locator("main [role=alert]")).toContainText("Correo o contraseña incorrectos");
});

test("rutas privadas redirigen a ingresar", async ({ page }) => {
  await page.goto("/mis-cursos");
  await expect(page).toHaveURL(/\/ingresar\?next=%2Fmis-cursos/);
  await page.goto("/progreso");
  await expect(page).toHaveURL(/\/ingresar/);
});

test("el parámetro next no permite redirigir fuera del sitio", async ({ page }) => {
  await page.goto("/ingresar?next=//evil.com");
  await expect(page.locator("input[name=next]")).toHaveValue("/mis-cursos");
});

test("ficha del curso: CTA lleva al registro con el curso", async ({ page }) => {
  await page.goto("/");
  const tarjeta = page.locator('main a[href^="/curso/"]').first();
  test.skip((await tarjeta.count()) === 0, "la academia de prueba no tiene cursos publicados");
  await tarjeta.click();
  await sinDesbordeHorizontal(page);
  await objetivosTactiles(page);
  await page.locator("a.fc-cta").click();
  await expect(page).toHaveURL(/\/registro\?curso=/);
});

test("confirmar y restablecer sin token muestran error", async ({ page }) => {
  await page.goto("/confirmar");
  await expect(page.locator("main [role=alert]")).toContainText("El enlace no es válido");
  await page.goto("/restablecer");
  await expect(page.locator("main [role=alert]")).toContainText("El enlace no es válido");
});
