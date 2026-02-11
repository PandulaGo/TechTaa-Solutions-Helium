using Helium.Application.Common.Models;

namespace Helium.Application.Common.Extensions;

public static class QueryableExtensions
{
    public static PagedResult<T> ToPagedResult<T>(this IQueryable<T> query, PaginationQuery pagination)
    {
        var page = pagination.Page < 1 ? 1 : pagination.Page;
        var pageSize = pagination.PageSize is < 1 or > 500 ? 20 : pagination.PageSize;

        var totalCount = query.Count();
        var items = query.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        return new PagedResult<T>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }
}
