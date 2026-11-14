package com.elibrary.catalog;

/** An author or publisher: an ID, a name, and how many books use it. */
public record CatalogEntry(String id, String name, int bookCount) {
}
