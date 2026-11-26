/** M2.2 alt removal (positive control, F65). Removes alt from <img> that have
 *  a non-empty alt. jscodeshift codemod over JSX. */
module.exports = function (file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);
  root.find(j.JSXOpeningElement, { name: { name: "img" } }).forEach((p) => {
    p.node.attributes = p.node.attributes.filter(
      (a) => !(a.type === "JSXAttribute" && a.name.name === "alt" &&
               a.value && a.value.value !== "")
    );
  });
  return root.toSource();
};
