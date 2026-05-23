// lib/core/services/api_service.dart
import 'dart:convert';
import 'dart:async';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';

class ApiException implements Exception {
  const ApiException(
    this.message, {
    this.url,
    this.statusCode,
    this.responseBody,
  });

  final String message;
  final String? url;
  final int? statusCode;
  final String? responseBody;

  @override
  String toString() {
    final parts = <String>[message];

    if (url != null) {
      parts.add('url=$url');
    }

    if (statusCode != null) {
      parts.add('statusCode=$statusCode');
    }

    if (responseBody != null && responseBody!.isNotEmpty) {
      parts.add('responseBody=$responseBody');
    }

    return parts.join(' | ');
  }
}

class ApiService {
  static const String _defaultBaseUrl = 'http://10.0.2.2:5000/api';
  static const String _configuredBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: _defaultBaseUrl,
  );
  static const Duration _timeout = Duration(seconds: 12);

  static String get baseUrl => _normalizeBaseUrl(_configuredBaseUrl);

  static void _debugLog(String message) {
    if (kDebugMode) {
      debugPrint('[ApiService] $message');
    }
  }

  static String _normalizeBaseUrl(String url) {
    final trimmed = url.trim();
    if (trimmed.isEmpty) {
      return _defaultBaseUrl;
    }

    return trimmed.endsWith('/')
        ? trimmed.substring(0, trimmed.length - 1)
        : trimmed;
  }

  Future<Map<String, dynamic>> get(
    String endpoint, {
    Map<String, String>? headers,
  }) async {
    final url = '$baseUrl$endpoint';
    _debugLog('GET $url');

    try {
      final response = await http
          .get(Uri.parse(url), headers: headers)
          .timeout(_timeout);

      return _parseResponse(response, url: url);
    } on TimeoutException {
      throw ApiException(
        'The server took too long to respond. Please make sure the backend is running and try again.',
        url: url,
      );
    } on SocketException {
      throw ApiException(
        'Could not connect to the server. Please check API_BASE_URL or make sure the backend is running.',
        url: url,
      );
    } on http.ClientException {
      throw ApiException(
        'Network connection to the server failed. Please try again later.',
        url: url,
      );
    } on FormatException {
      throw ApiException(
        'The server returned invalid data. Please make sure the backend is serving the correct JSON API.',
        url: url,
      );
    }
  }

  Future<Map<String, dynamic>> getByUrl(
    String url, {
    Map<String, String>? headers,
  }) async {
    try {
      final response = await http
          .get(Uri.parse(url), headers: headers)
          .timeout(_timeout);

      return _parseResponse(response);
    } on TimeoutException {
      throw const ApiException(
        'Yeu cau toi dich vu sach online qua lau. Hay thu lai sau.',
      );
    } on SocketException {
      throw const ApiException(
        'Khong the ket noi toi Google Books API. Hay kiem tra mang va thu lai.',
      );
    } on http.ClientException {
      throw const ApiException(
        'Ket noi toi Google Books API that bai. Hay thu lai sau.',
      );
    } on FormatException {
      throw const ApiException('Google Books API tra ve du lieu khong hop le.');
    }
  }

  Future<Map<String, dynamic>> post(
    String endpoint,
    Map<String, dynamic> data, {
    Map<String, String>? headers,
  }) async {
    final url = '$baseUrl$endpoint';
    _debugLog('POST $url');
    _debugLog('POST payload keys: ${data.keys.join(', ')}');

    try {
      final response = await http
          .post(
            Uri.parse(url),
            headers: {'Content-Type': 'application/json', ...?headers},
            body: jsonEncode(data),
          )
          .timeout(_timeout);

      return _parseResponse(response, url: url);
    } on TimeoutException {
      throw ApiException(
        'The server took too long to respond. Please make sure the backend is running and try again.',
        url: url,
      );
    } on SocketException {
      throw ApiException(
        'Could not connect to the server. Please check API_BASE_URL or make sure the backend is running.',
        url: url,
      );
    } on http.ClientException {
      throw ApiException(
        'Network connection to the server failed. Please try again later.',
        url: url,
      );
    } on FormatException {
      throw ApiException(
        'The server returned invalid data. Please make sure the backend is serving the correct JSON API.',
        url: url,
      );
    }
  }

  Future<Map<String, dynamic>> postMultipart(
    String endpoint, {
    required Map<String, String> fields,
    String? fileField,
    String? filePath,
    Map<String, String>? headers,
  }) async {
    final url = '$baseUrl$endpoint';
    _debugLog('POST multipart $url');

    try {
      final request = http.MultipartRequest('POST', Uri.parse(url))
        ..headers.addAll(headers ?? {})
        ..fields.addAll(fields);

      if (fileField != null && filePath != null && filePath.trim().isNotEmpty) {
        request.files.add(
          await http.MultipartFile.fromPath(fileField, filePath),
        );
      }

      final streamedResponse = await request.send().timeout(_timeout);
      final response = await http.Response.fromStream(streamedResponse);

      return _parseResponse(response, url: url);
    } on TimeoutException {
      throw ApiException(
        'The server took too long to respond. Please make sure the backend is running and try again.',
        url: url,
      );
    } on SocketException {
      throw ApiException(
        'Could not connect to the server. Please check API_BASE_URL or make sure the backend is running.',
        url: url,
      );
    } on http.ClientException {
      throw ApiException(
        'Network connection to the server failed. Please try again later.',
        url: url,
      );
    } on FormatException {
      throw ApiException(
        'The server returned invalid data. Please make sure the backend is serving the correct JSON API.',
        url: url,
      );
    }
  }

  Future<Map<String, dynamic>> delete(
    String endpoint, {
    Map<String, String>? headers,
  }) async {
    final url = '$baseUrl$endpoint';
    _debugLog('DELETE $url');

    try {
      final response = await http
          .delete(Uri.parse(url), headers: headers)
          .timeout(_timeout);

      return _parseResponse(response, url: url);
    } on TimeoutException {
      throw ApiException(
        'The server took too long to respond. Please make sure the backend is running and try again.',
        url: url,
      );
    } on SocketException {
      throw ApiException(
        'Could not connect to the server. Please check API_BASE_URL or make sure the backend is running.',
        url: url,
      );
    } on http.ClientException {
      throw ApiException(
        'Network connection to the server failed. Please try again later.',
        url: url,
      );
    } on FormatException {
      throw ApiException(
        'The server returned invalid data. Please make sure the backend is serving the correct JSON API.',
        url: url,
      );
    }
  }

  Map<String, dynamic> _parseResponse(http.Response response, {String? url}) {
    _debugLog(
      'Response ${response.statusCode} from ${url ?? 'unknown-url'}: ${response.body}',
    );

    final dynamic decoded = response.body.isEmpty
        ? <String, dynamic>{}
        : jsonDecode(response.body);

    final result = decoded is Map<String, dynamic>
        ? decoded
        : <String, dynamic>{};

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return result;
    }

    if (response.statusCode == 429) {
      throw ApiException(
        'Dich vu sach online dang gioi han qua nhieu yeu cau. Hay doi mot luc roi thu lai.',
        url: url,
        statusCode: response.statusCode,
        responseBody: response.body,
      );
    }

    throw ApiException(
      result['message'] as String? ??
          'The server returned error ${response.statusCode}.',
      url: url,
      statusCode: response.statusCode,
      responseBody: response.body,
    );
  }
}
