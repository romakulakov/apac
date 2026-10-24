/** Interaction staging (best-case rule) — matched to seed app1.
 *  Playwright form (axe/ibm) + Pa11y "actions" form. Keep both in sync. */

async function openSettingsDialog(page) {
  await page.getByRole("button", { name: /open settings/i }).click();
  await page.getByRole("dialog").waitFor({ state: "visible", timeout: 3000 })
    .catch(() => {}); // mutants may break the dialog role — scan anyway
  await page.waitForTimeout(150);
}
openSettingsDialog.stageName = "openSettingsDialog";

async function gotoForm(page) {
  await page.goto(page.url().split("#")[0] + "#/form");
  await page.waitForTimeout(150);
}
gotoForm.stageName = "gotoForm";

async function gotoFormSubmitInvalid(page) {
  await gotoForm(page);
  await page.locator("#submit-btn").click();
  await page.waitForTimeout(150);
}
gotoFormSubmitInvalid.stageName = "gotoFormSubmitInvalid";

async function gotoDash(page) {
  await page.goto(page.url().split("#")[0] + "#/dash");
  await page.waitForTimeout(150);
}
gotoDash.stageName = "gotoDash";

async function gotoDashLoad(page) {
  await gotoDash(page);
  await page.locator("#load-btn").click();
  await page.waitForTimeout(600); // async load settles in 400ms
}
gotoDashLoad.stageName = "gotoDashLoad";


/* ---------- app2-todomvc ---------- */
async function todoAdd(page) {
  await page.locator("#new-todo").fill("Benchmark task");
  await page.locator("#add-btn").click();
  await page.waitForTimeout(150);
}
todoAdd.stageName = "todoAdd";

async function todoToggleAll(page) {
  await page.locator("#toggle-all").click();
  await page.waitForTimeout(150);
}
todoToggleAll.stageName = "todoToggleAll";

async function todoEdit(page) {
  await page.locator(".edit-btn").first().click();
  await page.waitForTimeout(150);
}
todoEdit.stageName = "todoEdit";

/* ---------- app3-form ---------- */
async function formSubmitInvalid(page) {
  await page.locator("#next-btn").click();
  await page.waitForTimeout(150);
}
formSubmitInvalid.stageName = "formSubmitInvalid";

async function fillStep1(page) {
  await page.locator("#full-name").fill("Ada Lovelace");
  await page.locator("#email").fill("ada@example.org");
  await page.locator("#next-btn").click();
  await page.waitForTimeout(150);
}
async function formGotoStep2(page) { await fillStep1(page); }
formGotoStep2.stageName = "formGotoStep2";

async function formGotoStep3(page) {
  await fillStep1(page);
  await page.locator("#street").fill("1 Main St");
  await page.locator("#city").fill("Warsaw");
  await page.locator("#postal").fill("00-001");
  await page.locator("#next-btn").click();
  await page.waitForTimeout(150);
}
formGotoStep3.stageName = "formGotoStep3";

/* ---------- app4-dashboard ---------- */
async function dashRefresh(page) {
  await page.locator("#refresh-btn").click();
  await page.waitForTimeout(600);
}
dashRefresh.stageName = "dashRefresh";

async function dashGotoProjects(page) {
  await page.goto(page.url().split("#")[0] + "#/projects");
  await page.waitForTimeout(150);
}
dashGotoProjects.stageName = "dashGotoProjects";

async function dashSortTable(page) {
  await dashGotoProjects(page);
  await page.locator('.sort[data-key="name"]').click();
  await page.waitForTimeout(150);
}
dashSortTable.stageName = "dashSortTable";

async function dashOpenConfirm(page) {
  await page.goto(page.url().split("#")[0] + "#/settings");
  await page.locator("#reset-btn").click();
  await page.waitForTimeout(150);
}
dashOpenConfirm.stageName = "dashOpenConfirm";

async function dashRevealAdvanced(page) {
  await page.goto(page.url().split("#")[0] + "#/settings");
  await page.locator("#adv-btn").click();
  await page.waitForTimeout(150);
}
dashRevealAdvanced.stageName = "dashRevealAdvanced";

export const STAGING = { openSettingsDialog, gotoForm, gotoFormSubmitInvalid,
                         gotoDash, gotoDashLoad,
                         todoAdd, todoToggleAll, todoEdit,
                         formSubmitInvalid, formGotoStep2, formGotoStep3,
                         dashRefresh, dashGotoProjects, dashSortTable,
                         dashOpenConfirm, dashRevealAdvanced };

export const STAGING_ACTIONS = {  // Pa11y equivalents
  // NOTE pa11y action grammar: "navigate to" needs a full URL (hash-only
  // fails) and "wait for element ... to contain" does not exist — hash
  // routes are entered by clicking nav links; text-only async updates get
  // no wait (the staged DOM differs only by textContent).
  openSettingsDialog: ['click element #open-settings',
                       'wait for element #overlay to be visible'],
  gotoForm:           ['click element .nav a[href="#/form"]'],
  gotoFormSubmitInvalid: ['click element .nav a[href="#/form"]',
                          'click element #submit-btn'],
  gotoDash:           ['click element .nav a[href="#/dash"]'],
  gotoDashLoad:       ['click element .nav a[href="#/dash"]',
                       'click element #load-btn'],
  todoAdd:            ['set field #new-todo to Benchmark task', 'click element #add-btn'],
  todoToggleAll:      ['click element #toggle-all'],
  todoEdit:           ['click element .edit-btn'],
  formSubmitInvalid:  ['click element #next-btn'],
  formGotoStep2:      ['set field #full-name to Ada Lovelace',
                       'set field #email to ada@example.org', 'click element #next-btn'],
  formGotoStep3:      ['set field #full-name to Ada Lovelace',
                       'set field #email to ada@example.org', 'click element #next-btn',
                       'set field #street to 1 Main St', 'set field #city to Warsaw',
                       'set field #postal to 00-001', 'click element #next-btn'],
  dashRefresh:        ['click element #refresh-btn'],
  dashGotoProjects:   ['click element .nav a[href="#/projects"]'],
  dashSortTable:      ['click element .nav a[href="#/projects"]',
                       'click element .sort'],
  dashOpenConfirm:    ['click element .nav a[href="#/settings"]',
                       'click element #reset-btn'],
  dashRevealAdvanced: ['click element .nav a[href="#/settings"]',
                       'click element #adv-btn'],
};
