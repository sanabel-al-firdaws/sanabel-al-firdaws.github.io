import config from "virtual:starlight-view-modes-config";

export function activateZenMode() {
    document.body.classList.add("view-modes-zen-mode");

    const zenModeOnText = document.getElementById("view-modes-zen-mode-on-text");
    if (zenModeOnText) zenModeOnText.innerText = "إيقاف وضع القراءة";

    const zenModeOffHeader = document.getElementById("view-modes-zen-mode-off-header");
    if (zenModeOffHeader) zenModeOffHeader.title = "إيقاف وضع القراءة";

    const zenModeOffHeaderMobile = document.getElementById("view-modes-zen-mode-off-header-mobile");
    if (zenModeOffHeaderMobile) zenModeOffHeaderMobile.title = "إيقاف وضع القراءة";

    sessionStorage.setItem("viewModesZenMode", "true");
}

export function deactivateZenMode() {
    document.body.classList.remove("view-modes-zen-mode");

    const zenModeOnText = document.getElementById("view-modes-zen-mode-on-text");
    if (zenModeOnText) zenModeOnText.innerText = "تشغيل وضع القراءة";

    const zenModeOffHeader = document.getElementById("view-modes-zen-mode-off-header");
    if (zenModeOffHeader) zenModeOffHeader.title = "تشغيل وضع القراءة";

    const zenModeOffHeaderMobile = document.getElementById("view-modes-zen-mode-off-header-mobile");
    if (zenModeOffHeaderMobile) zenModeOffHeaderMobile.title = "تشغيل وضع القراءة";

    sessionStorage.removeItem("viewModesZenMode");
}

export function activatePresentationMode() {
    document.body.classList.add("view-modes-presentation-mode");

    sessionStorage.setItem("viewModesPresentationMode", "true");
}

export function deactivatePresentationMode() {
    document.body.classList.remove("view-modes-presentation-mode");
    sessionStorage.removeItem("viewModesPresentationMode");
}

export function deactivateAllModes() {
    deactivateZenMode();
    deactivatePresentationMode();
}
