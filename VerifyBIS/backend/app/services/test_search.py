from app.services.search_service import semantic_search


def main():
    query = "requirements for the National Flag of India"

    print()
    print("================================")
    print("SEMANTIC SEARCH")
    print("================================")
    print(f"Query: {query}")
    print()

    results = semantic_search(query, limit=5)

    if not results:
        print("No results found.")
        return

    for index, result in enumerate(results, start=1):
        print("--------------------------------")
        print(f"Result       : {index}")
        print(f"IS Number    : {result['is_number']}")
        print(f"Year         : {result['year']}")
        print(f"Title        : {result['title']}")
        print(f"Page         : {result['page_number']}")
        print(f"Similarity   : {result['similarity']:.4f}")
        print(f"Document ID  : {result['document_id']}")
        print()
        print(result["content"][:500])
        print()

    print("================================")


if __name__ == "__main__":
    main()