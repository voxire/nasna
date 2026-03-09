import { useEffect, useMemo, useState } from 'react';
import type {
  CollectionReference,
  DocumentData,
  OrderByDirection,
  QueryConstraint,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { limit, onSnapshot, orderBy, query, startAfter } from 'firebase/firestore';

interface UsePaginatedQueryOptions<T> {
  collectionRef: CollectionReference<DocumentData>;
  constraints?: QueryConstraint[];
  pageSize?: number;
  orderByField: string;
  orderDirection?: OrderByDirection;
  mapDoc: (doc: QueryDocumentSnapshot<DocumentData>) => T;
  resetKeys?: Array<string | number | boolean | null | undefined>;
}

interface UsePaginatedQueryResult<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  page: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: () => void;
  previousPage: () => void;
  resetPagination: () => void;
}

export function usePaginatedQuery<T>({
  collectionRef,
  constraints,
  pageSize = 10,
  orderByField,
  orderDirection = 'desc',
  mapDoc,
  resetKeys = [],
}: UsePaginatedQueryOptions<T>): UsePaginatedQueryResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [cursorStack, setCursorStack] = useState<Array<QueryDocumentSnapshot<DocumentData> | null>>(
    [null],
  );
  const [hasNextPage, setHasNextPage] = useState(false);

  const resetKey = useMemo(() => JSON.stringify(resetKeys), [resetKeys]);
  const activeConstraints = useMemo(() => constraints ?? [], [constraints]);
  const pageCursor = cursorStack[page - 1] ?? null;

  useEffect(() => {
    setPage(1);
    setCursorStack([null]);
  }, [resetKey]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const pageQuery = query(
      collectionRef,
      ...activeConstraints,
      orderBy(orderByField, orderDirection),
      ...(pageCursor ? [startAfter(pageCursor)] : []),
      limit(pageSize + 1),
    );

    const unsubscribe = onSnapshot(
      pageQuery,
      (snapshot) => {
        const docs = snapshot.docs;
        const visibleDocs = docs.slice(0, pageSize);

        setItems(visibleDocs.map(mapDoc));
        setHasNextPage(docs.length > pageSize);
        setLoading(false);

        setCursorStack((previous) => {
          const next = [...previous];
          next[page - 1] = pageCursor;
          next[page] = visibleDocs.length > 0 ? visibleDocs[visibleDocs.length - 1] : pageCursor;
          const hasChanged =
            next.length !== previous.length ||
            next.some((cursor, index) => cursor?.id !== previous[index]?.id);

          return hasChanged ? next : previous;
        });
      },
      () => {
        setError('Failed to load data.');
        setItems([]);
        setHasNextPage(false);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [
    collectionRef,
    activeConstraints,
    mapDoc,
    orderByField,
    orderDirection,
    page,
    pageCursor,
    pageSize,
  ]);

  return {
    items,
    loading,
    error,
    page,
    hasNextPage,
    hasPreviousPage: page > 1,
    nextPage: () => {
      if (hasNextPage) {
        setPage((current) => current + 1);
      }
    },
    previousPage: () => {
      if (page > 1) {
        setPage((current) => current - 1);
      }
    },
    resetPagination: () => {
      setPage(1);
      setCursorStack([null]);
    },
  };
}
