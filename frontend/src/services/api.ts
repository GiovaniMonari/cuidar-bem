const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiService {
  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  private headers(withAuth = false): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (withAuth) {
      const token = this.getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API_URL}${endpoint}`, options);
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Erro na requisição' }));
      throw new Error(error.message || 'Erro na requisição');
    }
    return res.json();
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<any>('/auth/login', {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: any) {
    return this.request<any>('/auth/register', {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(data),
    });
  }

  async getProfile() {
    return this.request<any>('/users/me', {
      headers: this.headers(true),
    });
  }

  // Caregivers
  async getCaregivers(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/caregivers?${query}`, {
      headers: this.headers(),
    });
  }

  async getCaregiver(id: string) {
    return this.request<any>(`/caregivers/${id}`, {
      headers: this.headers(),
    });
  }

  async createCaregiverProfile(data: any) {
    return this.request<any>('/caregivers', {
      method: 'POST',
      headers: this.headers(true),
      body: JSON.stringify(data),
    });
  }

  async updateCaregiverProfile(id: string, data: any) {
    return this.request<any>(`/caregivers/${id}`, {
      method: 'PUT',
      headers: this.headers(true),
      body: JSON.stringify(data),
    });
  }

  async getMyCaregiverProfile() {
    return this.request<any>('/caregivers/user/me', {
      headers: this.headers(true),
    });
  }

  // Bookings
  async createBooking(data: any) {
    return this.request<any>('/bookings', {
      method: 'POST',
      headers: this.headers(true),
      body: JSON.stringify(data),
    });
  }

  async getMyBookings() {
    return this.request<any>('/bookings/my', {
      headers: this.headers(true),
    });
  }

  async updateBookingStatus(id: string, status: string) {
    return this.request<any>(`/bookings/${id}/status`, {
      method: 'PUT',
      headers: this.headers(true),
      body: JSON.stringify({ status }),
    });
  }

  // Reviews
  async getReviews(caregiverId: string) {
    return this.request<any>(`/reviews/caregiver/${caregiverId}`, {
      headers: this.headers(),
    });
  }

  async createReview(data: any) {
    return this.request<any>('/reviews', {
      method: 'POST',
      headers: this.headers(true),
      body: JSON.stringify(data),
    });
  }

  // Payments
  async getPaymentByBooking(bookingId: string) {
    return this.request<any>(`/payments/booking/${bookingId}`, {
      headers: this.headers(true),
    });
  }

  async getMyPayments() {
    return this.request<any>('/payments/my', {
      headers: this.headers(true),
    });
  }

  async simulatePayment(bookingId: string) {
    return this.request<any>(`/payments/simulate/${bookingId}`, {
      method: 'POST',
      headers: this.headers(true),
    });
  }

  async getServiceTypes(category?: string) {
    const query = category ? `?category=${category}` : '';
    return this.request<any>(`/services${query}`, {
      headers: this.headers(),
    });
  }

  async getServiceType(key: string) {
    return this.request<any>(`/services/${key}`, {
      headers: this.headers(),
    });
  }

  async calculateServicePrice(serviceKey: string, durationKey: string, pricePerHour?: number) {
    const query = new URLSearchParams({
      duration: durationKey,
      ...(pricePerHour && { pricePerHour: String(pricePerHour) }),
    }).toString();
    return this.request<any>(`/services/${serviceKey}/calculate?${query}`, {
      headers: this.headers(),
    });
  }

  async canReviewCaregiver(caregiverId: string) {
    return this.request<{ canReview: boolean; bookingId?: string }>(
      `/reviews/can-review/${caregiverId}`,
      { headers: this.headers(true) },
    );
  }

    async getCaregiverAvailability(id: string) {
    return this.request<any>(`/caregivers/${id}/availability`, {
      headers: this.headers(),
    });
  }
}

export const api = new ApiService();