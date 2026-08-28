import { describe, it, expect, vi } from 'vitest';
import { apolloServer } from '../src/app.js';
import { Org } from '../src/models/org.model.js';
import { Service } from '../src/models/service.model.js';

describe('GraphQL Apollo Server Resolvers & Schema', () => {
  it('should execute health query successfully', async () => {
    const res = await apolloServer.executeOperation({
      query: '{ health }',
    });

    expect(res.body.kind).toBe('single');
    expect(res.body.singleResult.errors).toBeUndefined();
    expect(res.body.singleResult.data.health).toContain('AppointFlow GraphQL API Online');
  });

  it('should query services for an organization', async () => {
    vi.spyOn(Service, 'find').mockResolvedValueOnce([
      {
        _id: '6a7eaf67d2fcc184cc6a96fb',
        name: 'Haircut & Styling',
        price: 35,
        durationMinutes: 30,
        active: true,
        orgId: '6a7eaf67d2fcc184cc6a96fb',
      },
    ]);

    const res = await apolloServer.executeOperation({
      query: `
        query GetServices($orgId: ID!) {
          services(orgId: $orgId) {
            _id
            name
            price
            durationMinutes
          }
        }
      `,
      variables: { orgId: '6a7eaf67d2fcc184cc6a96fb' },
    });

    expect(res.body.kind).toBe('single');
    expect(res.body.singleResult.errors).toBeUndefined();
    expect(res.body.singleResult.data.services).toBeDefined();
    expect(res.body.singleResult.data.services.length).toBe(1);
    expect(res.body.singleResult.data.services[0].name).toBe('Haircut & Styling');
  });

  it('should query organization by slug', async () => {
    vi.spyOn(Org, 'findOne').mockResolvedValueOnce({
      _id: '6a7eaf67d2fcc184cc6a96fb',
      name: 'HM Salon',
      slug: 'hm-salon-org',
      timezone: 'UTC',
    });

    const res = await apolloServer.executeOperation({
      query: `
        query GetOrg($slug: String!) {
          org(slug: $slug) {
            name
            slug
            timezone
          }
        }
      `,
      variables: { slug: 'hm-salon-org' },
    });

    expect(res.body.kind).toBe('single');
    expect(res.body.singleResult.errors).toBeUndefined();
    expect(res.body.singleResult.data.org.name).toBe('HM Salon');
    expect(res.body.singleResult.data.org.slug).toBe('hm-salon-org');
  });
});
