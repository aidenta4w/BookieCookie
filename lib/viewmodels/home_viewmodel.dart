import 'package:flutter/material.dart';

import '../core/services/api_service.dart';
import '../data/models/home_dashboard_model.dart';
import '../data/models/user_model.dart';

class HomeViewModel extends ChangeNotifier {
  HomeViewModel({required this.user, this.token, ApiService? apiService})
    : _apiService = apiService ?? ApiService();

  final ApiService _apiService;
  final UserModel user;
  final String? token;

  HomeDashboardModel? dashboard;
  bool isLoading = false;
  String? errorMessage;
  int? _loadedYear;
  DateTime? _loadedAnchorDate;

  Future<void> loadDashboard({int? year, DateTime? anchorDate}) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final resolvedYear = year ?? anchorDate?.year ?? _loadedYear;
      final queryParameters = <String, String>{};
      if (resolvedYear != null) {
        queryParameters['year'] = '$resolvedYear';
      }
      if (anchorDate != null) {
        queryParameters['anchorDate'] = _formatDateOnly(anchorDate);
      }
      final query = queryParameters.isEmpty
          ? ''
          : '?${Uri(queryParameters: queryParameters).query}';
      final result = await _apiService.get(
        '/home/${user.id}/dashboard$query',
        headers: token == null ? null : {'Authorization': 'Bearer $token'},
      );

      if (result['success'] == true) {
        final data = result['data'] as Map<String, dynamic>? ?? {};
        dashboard = HomeDashboardModel.fromJson(data);
        _loadedYear = dashboard?.year ?? resolvedYear;
        _loadedAnchorDate = anchorDate ?? _loadedAnchorDate;
      } else {
        errorMessage =
            result['message'] as String? ?? 'Failed to load homepage';
      }
    } catch (_) {
      errorMessage = 'Could not load homepage data';
    }

    isLoading = false;
    notifyListeners();
  }

  Future<void> updateYearlyGoal(int targetValue, {int? year}) async {
    try {
      final result = await _apiService.post(
        '/home/${user.id}/goals/yearly',
        {'target_value': targetValue, 'year': year},
        headers: token == null ? null : {'Authorization': 'Bearer $token'},
      );

      if (result['success'] != true) {
        throw ApiException(
          result['message'] as String? ?? 'Could not update yearly goal',
        );
      }

      errorMessage = null;
      dashboard = _applyYearlyGoalUpdate(dashboard, targetValue);
      await loadDashboard(
        year: year ?? _loadedYear ?? dashboard?.year,
        anchorDate: _loadedAnchorDate,
      );
    } on ApiException {
      rethrow;
    } catch (error) {
      throw ApiException('Could not update yearly goal: $error');
    }
  }

  HomeDashboardModel? _applyYearlyGoalUpdate(
    HomeDashboardModel? current,
    int targetValue,
  ) {
    if (current == null) {
      return current;
    }

    final currentGoals = current.goals;
    final currentStats = current.statistics;
    final currentYearStats = currentStats?.year;

    return HomeDashboardModel(
      currentReading: current.currentReading,
      streakDays: current.streakDays,
      maxStreakDays: current.maxStreakDays,
      activityCount: current.activityCount,
      finishedInYear: current.finishedInYear,
      year: current.year,
      goals: currentGoals == null
          ? DashboardGoals(yearlyBooks: targetValue, monthlyHours: 0)
          : DashboardGoals(
              yearlyBooks: targetValue,
              monthlyHours: currentGoals.monthlyHours,
            ),
      statistics: currentStats == null || currentYearStats == null
          ? currentStats
          : DashboardStatistics(
              today: currentStats.today,
              week: currentStats.week,
              chart: currentStats.chart,
              year: YearStatistics(
                readingHours: currentYearStats.readingHours,
                readingMinutes: currentYearStats.readingMinutes,
                readingSeconds: currentYearStats.readingSeconds,
                booksFinished: currentYearStats.booksFinished,
                quotesSaved: currentYearStats.quotesSaved,
                currentReadingCount: currentYearStats.currentReadingCount,
                activeDays: currentYearStats.activeDays,
                completionRate: currentYearStats.completionRate,
                yearlyGoalBooks: targetValue,
                yearlyActivityLevels: currentYearStats.yearlyActivityLevels,
                highlightedBookTitle: currentYearStats.highlightedBookTitle,
              ),
            ),
    );
  }

  String _formatDateOnly(DateTime date) {
    final normalized = DateTime(date.year, date.month, date.day);
    final month = normalized.month.toString().padLeft(2, '0');
    final day = normalized.day.toString().padLeft(2, '0');
    return '${normalized.year}-$month-$day';
  }
}
