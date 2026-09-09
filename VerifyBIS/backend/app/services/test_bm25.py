from app.services.bm25_service import bm25_search


def main():

    query = "National Flag of India"

    print()
    print("================================")
    print("BM25 SEARCH")
    print("================================")
    print(f"Query: {query}")
    print()

    results = bm25_search(
        query,
        limit=5,
    )

    if not results:
        print("No results found.")
        return

    for index, result in enumerate(results, start=1):

        print("--------------------------------")
        print(f"Result     : {index}")
        print(f"IS Number  : {result['is_number']}")
        print(f"Year       : {result['year']}")
        print(f"Title      : {result['title']}")
        print(f"Page       : {result['page_number']}")
        print(f"BM25 Score : {result['bm25_score']:.4f}")
        print(f"Document   : {result['document_id']}")
        print()
        print(result["content"][:500])
        print()

    print("================================")


if __name__ == "__main__":
    main()