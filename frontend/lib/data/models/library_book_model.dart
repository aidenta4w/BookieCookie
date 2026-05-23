class LibraryBookModel {
  const LibraryBookModel({
    required this.id,
    required this.bookId,
    required this.title,
    required this.author,
    required this.status,
    this.publishedYear,
    this.startDate,
    this.finishDate,
    this.createdAt,
    this.finishYear,
    this.coverImageUrl,
    this.rating,
    this.note,
  });

  final int id;
  final int bookId;
  final String title;
  final String author;
  final String status;
  final int? publishedYear;
  final DateTime? startDate;
  final DateTime? finishDate;
  final DateTime? createdAt;
  final int? finishYear;
  final String? coverImageUrl;
  final int? rating;
  final String? note;

  Set<int> get filterYears {
    final years = <int>{};

    if (finishYear != null && finishYear! > 0) {
      years.add(finishYear!);
    }

    return years;
  }

  factory LibraryBookModel.fromJson(Map<String, dynamic> json) {
    final rawId = json['id'];
    final rawBookId = json['book_id'];
    final rawRating = json['rating'];
    final rawPublishedYear = json['published_year'];

    return LibraryBookModel(
      id: rawId is num ? rawId.toInt() : int.tryParse('$rawId') ?? 0,
      bookId: rawBookId is num
          ? rawBookId.toInt()
          : int.tryParse('$rawBookId') ?? 0,
      title: json['title'] as String? ?? 'Untitled',
      author: json['author'] as String? ?? 'Unknown author',
      status: json['status'] as String? ?? 'plan_to_read',
      publishedYear: rawPublishedYear is num
          ? rawPublishedYear.toInt()
          : int.tryParse('$rawPublishedYear'),
      startDate: _toDateTime(json['start_date']),
      finishDate: _toDateTime(json['finish_date']),
      createdAt: _toDateTime(json['created_at']),
      finishYear: _extractCalendarYear(json['finish_date']),
      coverImageUrl: json['cover_image_url'] as String?,
      rating: rawRating is num ? rawRating.toInt() : int.tryParse('$rawRating'),
      note: json['note'] as String?,
    );
  }
}

int? _extractCalendarYear(dynamic value) {
  if (value == null) {
    return null;
  }

  final text = value.toString().trim();
  if (text.isEmpty) {
    return null;
  }

  final prefixMatch = RegExp(r'^(\d{4})').firstMatch(text);
  if (prefixMatch != null) {
    return int.tryParse(prefixMatch.group(1)!);
  }

  return DateTime.tryParse(text)?.year;
}

DateTime? _toDateTime(dynamic value) {
  if (value == null) {
    return null;
  }

  final parsed = DateTime.tryParse(value.toString());
  if (parsed == null) {
    return null;
  }

  return parsed.isUtc ? parsed.toLocal() : parsed;
}
