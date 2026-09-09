from app.services.hybrid_search import hybrid_search


def main():

    query = "National Flag of India"

    print()
    print("================================")
    print("HYBRID SEARCH")
    print("================================")
    print(f"Query: {query}")
    print()

    results = hybrid_search(
        query,
        limit=5,
    )

    for index, result in enumerate(results, start=1):

        print("--------------------------------")
        print(f"Result     : {index}")
        print(f"IS Number  : {result['is_number']}")
        print(f"Year       : {result['year']}")
        print(f"Title      : {result['title']}")
        print(f"Page       : {result['page_number']}")
        print(f"RRF Score  : {result['rrf_score']:.6f}")
        print(f"Document   : {result['document_id']}")
        print()
        print(result["content"][:400])
        print()

    print("================================")


if __name__ == "__main__":
    main()