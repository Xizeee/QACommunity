import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

// 统一面包屑：末级为当前页（纯文本，不跳转），可返回的上级节点为链接
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  if (!items.length) {
    return null;
  }
  return (
    <nav className="breadcrumb" aria-label="面包屑">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="breadcrumb-item">
            {item.to && !isLast ? (
              <Link to={item.to}>{item.label}</Link>
            ) : (
              <span className="breadcrumb-current">{item.label}</span>
            )}
            {!isLast && <span className="breadcrumb-sep">/</span>}
          </span>
        );
      })}
    </nav>
  );
}
