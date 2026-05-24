import * as React from "react";

export function hasNestedTitle(
  children: React.ReactNode,
  titleComponents: React.ElementType | React.ElementType[],
): boolean {
  return React.Children.toArray(children).some((child) => containsComponent(child, titleComponents));
}

export function hasNestedDescription(
  children: React.ReactNode,
  descriptionComponents: React.ElementType | React.ElementType[],
): boolean {
  return React.Children.toArray(children).some((child) => containsComponent(child, descriptionComponents));
}

export function ensureHiddenTitle(
  children: React.ReactNode,
  titleComponents: React.ElementType | React.ElementType[],
  fallbackTitle: string,
) {
  if (hasNestedTitle(children, titleComponents)) {
    return children;
  }

  const [titleComponent] = Array.isArray(titleComponents) ? titleComponents : [titleComponents];

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(titleComponent, { className: "sr-only" }, fallbackTitle),
    children,
  );
}

function containsComponent(
  node: React.ReactNode,
  componentTypes: React.ElementType | React.ElementType[],
): boolean {
  if (!React.isValidElement(node)) return false;

  const components = Array.isArray(componentTypes) ? componentTypes : [componentTypes];

  if (components.includes(node.type as React.ElementType)) {
    return true;
  }

  return React.Children.toArray(node.props?.children).some((child) => containsComponent(child, componentTypes));
}
