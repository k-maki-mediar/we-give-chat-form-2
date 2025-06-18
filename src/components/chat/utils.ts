export function template(text: string, context: Record<string, any>): string {
  return text.replace(/\{([^}]+)\}/g, (match, key) => {
    const keys = key.split('.');
    let value: any = context;
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }
    
    return value !== undefined ? String(value) : match;
  });
}

export function autoScroll(element: HTMLElement) {
  element.scrollTop = element.scrollHeight;
}