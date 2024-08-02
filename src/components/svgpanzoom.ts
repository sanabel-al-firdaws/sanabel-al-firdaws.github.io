import "@beoe/pan-zoom/css/PanZoomUi.css";
import { PanZoomUi } from "@beoe/pan-zoom";

// for BEOE diagrams
document.querySelectorAll(".beoe").forEach((container) => {
  const element = container.firstElementChild;
  if (!element) return;
  // @ts-expect-error
  new PanZoomUi({ element, container }).on();
});

// for content images
document
  .querySelectorAll("img")
  .forEach((element) => {
    if (element.parentElement?.tagName === "PICTURE") {
      element = element.parentElement;
    }
    const container = document.createElement("figure");
    container.classList.add("beoe");
    element.replaceWith(container);
    container.append(element);
    new PanZoomUi({ element, container }).on();
  });
