import { Router } from 'express';
export function bookingRoutes(service, repository) {
  const router = Router();
  router.get('/health', async (_req, res) => { await repository.ready(); res.json({ status: 'ready' }); });
  router.get('/catalog', async (_req, res) => res.json(await service.catalog()));
  router.get('/rooms', async (req, res) => res.json(await service.rooms(req.query)));
  router.get('/bookings', async (_req, res) => res.json(await service.list()));
  router.post('/bookings', async (req, res) => {
    const booking = await service.save(req.body);
    res.location(`/api/bookings/${booking.bookingId}`).status(201).json(booking);
  });
  router.get('/bookings/:bookingId', async (req, res) => res.json(await service.get(req.params.bookingId)));
  router.put('/bookings/:bookingId', async (req, res) => res.json(await service.save(req.body, req.params.bookingId)));
  router.delete('/bookings/:bookingId', async (req, res) => res.json(await service.cancel(req.params.bookingId)));
  return router;
}
