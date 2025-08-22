// Simple Analytics Script for TVTOR Website
(function() {
    'use strict';
    
    // Initialize analytics data
    let analyticsData = JSON.parse(localStorage.getItem('tvtorAnalytics')) || {
        pageViews: 0,
        visits: 0,
        firstVisit: null,
        lastVisit: null,
        totalTime: 0,
        startTime: Date.now()
    };
    
    // Check if this is a new visit
    const now = Date.now();
    const lastVisit = analyticsData.lastVisit;
    const isNewVisit = !lastVisit || (now - lastVisit) > 1800000; // 30 minutes
    
    if (isNewVisit) {
        analyticsData.visits++;
        analyticsData.firstVisit = analyticsData.firstVisit || now;
    }
    
    analyticsData.pageViews++;
    analyticsData.lastVisit = now;
    
    // Save to localStorage
    localStorage.setItem('tvtorAnalytics', JSON.stringify(analyticsData));
    
    // Track time spent on page
    let pageStartTime = Date.now();
    
    // Update time when page becomes hidden/visible
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            // Page became hidden, calculate time spent
            const timeSpent = Date.now() - pageStartTime;
            analyticsData.totalTime += timeSpent;
            localStorage.setItem('tvtorAnalytics', JSON.stringify(analyticsData));
        } else {
            // Page became visible, reset timer
            pageStartTime = Date.now();
        }
    });
    
    // Track time when page is unloaded
    window.addEventListener('beforeunload', function() {
        const timeSpent = Date.now() - pageStartTime;
        analyticsData.totalTime += timeSpent;
        localStorage.setItem('tvtorAnalytics', JSON.stringify(analyticsData));
    });
    
    // Track form submissions
    document.addEventListener('DOMContentLoaded', function() {
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', function() {
                // Track form submission
                let formData = JSON.parse(localStorage.getItem('tvtorFormSubmissions')) || 0;
                formData++;
                localStorage.setItem('tvtorFormSubmissions', JSON.stringify(formData));
            });
        }
    });
    
    // Function to get analytics data (can be called from console)
    window.getTvtorAnalytics = function() {
        const data = JSON.parse(localStorage.getItem('tvtorAnalytics')) || {};
        const formSubmissions = JSON.parse(localStorage.getItem('tvtorFormSubmissions')) || 0;
        
        return {
            ...data,
            formSubmissions: formSubmissions,
            averageTimePerVisit: data.visits > 0 ? Math.round(data.totalTime / data.visits / 1000) : 0,
            averageTimePerPage: data.pageViews > 0 ? Math.round(data.totalTime / data.pageViews / 1000) : 0
        };
    };
    
    // Log analytics data to console (for development)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('TVTOR Analytics loaded. Use getTvtorAnalytics() to view data.');
    }
    
})();
