var createElement = function (parent, tag, id, attributes) {
  var el = document.createElement(tag);
  el.setAttribute('id', id);
  if (attributes !== undefined) {
    for (attribute in attributes) {
      var attributeName = attribute;
      var attributeValue = attributes[attribute];
      //no caso do IE tem que se usar a propriedade "className" senão o estilo não é aplicado. Também são usadas regras CSS específicas para IE porque este não suporta animações
      if (attributeName == "class" && !document.createEvent) { //IE         
        el.className = attributeValue + "IE";
      } else { //Non-IE
        el.setAttribute(attribute, attributeValue);
      }
    }
  }
  parent.appendChild(el);
  return el;
}
document.addEventListener('DOMContentLoaded', async function () {
  const url = await chrome.extension.getBackgroundPage().getMyUrl();
  var personalUrlEl = document.getElementById('personalUrl');
  var personalUrlExplanationEl = document.getElementById('personalUrlExplanation');
  personalUrlExplanationEl.style.display = "block";
  personalUrlEl.setAttribute("href", url);
  personalUrlEl.innerHTML = url;
  const myQrCode = await chrome.extension.getBackgroundPage().getMyQrCode();
  var personalUrlSection = document.getElementById('personalUrlSection');
  createElement(personalUrlSection, "img", "personalQr", { "src": myQrCode });
});