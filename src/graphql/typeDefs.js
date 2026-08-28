
export const typeDefs = `#graphql
  enum UserRole {
    owner
    staff
    customer
  }

  enum BookingStatus {
    pending
    confirmed
    completed
    cancelled
  }

  type User {
    _id: ID!
    name: String!
    email: String!
    role: UserRole!
    orgId: ID!
    createdAt: String
    updatedAt: String
  }

  type Org {
    _id: ID!
    name: String!
    slug: String!
    timezone: String
    plan: String
    createdAt: String
    updatedAt: String
  }

  type Service {
    _id: ID!
    name: String!
    description: String
    durationMinutes: Int!
    price: Float!
    active: Boolean!
    orgId: ID!
  }

  type Slot {
    _id: ID!
    startTime: String!
    endTime: String!
    status: String!
  }

  type Availability {
    _id: ID!
    orgId: ID!
    staffId: ID!
    dayOfWeek: Int!
    startTime: String!
    endTime: String!
  }

  type Booking {
    _id: ID!
    orgId: ID!
    customerId: ID!
    staffId: ID!
    serviceId: ID!
    slotId: ID!
    price: Float!
    date: String!
    startAt: String!
    endAt: String!
    status: BookingStatus!
    customer: User
    staff: User
    service: Service
  }

  type StaffStats {
    totalBookings: Int!
    completed: Int!
    pending: Int!
    cancelled: Int!
  }

  type Query {
    """
    Health check query
    """
    health: String!

    """
    Returns the currently authenticated user based on JWT cookie or Authorization header
    """
    me: User

    """
    Get organization by ID or slug
    """
    org(id: ID, slug: String): Org

    """
    List all active services for an organization
    """
    services(orgId: ID!): [Service!]!

    """
    Get a single service by ID
    """
    service(id: ID!): Service

    """
    List staff members for an organization
    """
    staff(orgId: ID!): [User!]!

    """
    Get generated slots for a staff member on a specific date (YYYY-MM-DD)
    """
    slots(staffId: ID!, date: String!): [Slot!]!

    """
    Get all weekly working availability rules for a staff member
    """
    availability(staffId: ID!, orgId: ID): [Availability!]!

    """
    Get bookings for the authenticated user (or filtered by orgId for owners)
    """
    bookings(orgId: ID, date: String, status: BookingStatus): [Booking!]!

    """
    Get today performance stats for a staff member (or current staff if authenticated)
    """
    todayStats(staffId: ID): StaffStats

    """
    Get weekly performance stats for a staff member
    """
    weeklyStats(staffId: ID): StaffStats

    """
    Get monthly performance stats for a staff member
    """
    monthlyStats(staffId: ID): StaffStats
  }
`;
