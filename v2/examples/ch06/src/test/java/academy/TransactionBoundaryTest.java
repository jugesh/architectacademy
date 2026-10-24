package academy;
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;
import org.springframework.aop.framework.ProxyFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.*;
import org.springframework.transaction.annotation.*;
import org.springframework.transaction.interceptor.TransactionInterceptor;
import org.springframework.transaction.support.TransactionTemplate;
import java.util.UUID;

/** Real Spring interceptor + H2 commit behavior; not PostgreSQL isolation evidence. */
public class TransactionBoundaryTest {
    interface Operations { void inner(); void outer(); void checked() throws Exception; void checkedRollback() throws Exception; }
    public static class Service implements Operations {
        final JdbcTemplate jdbc;
        Service(JdbcTemplate jdbc) { this.jdbc=jdbc; }
        @Transactional public void inner() {
            jdbc.update("insert into orders(id) values (1)");throw new IllegalStateException("after write");
        }
        public void outer() { inner(); } // Same target: no proxy interception at inner().
        @Transactional public void checked() throws Exception {
            jdbc.update("insert into orders(id) values (2)");throw new Exception("checked");
        }
        @Transactional(rollbackFor=Exception.class) public void checkedRollback() throws Exception {
            jdbc.update("insert into orders(id) values (3)");throw new Exception("checked rollback");
        }
    }
    JdbcTemplate jdbc; DataSourceTransactionManager manager; Operations proxy;
    @BeforeEach void setup() {
        DriverManagerDataSource ds=new DriverManagerDataSource("jdbc:h2:mem:"+UUID.randomUUID()+";DB_CLOSE_DELAY=-1","sa","");
        jdbc=new JdbcTemplate(ds);manager=new DataSourceTransactionManager(ds);
        jdbc.execute("create table orders(id int primary key)");jdbc.execute("create table outbox(id int primary key)");
        TransactionInterceptor advice=new TransactionInterceptor();advice.setTransactionManager(manager);
        advice.setTransactionAttributeSource(new AnnotationTransactionAttributeSource());advice.afterPropertiesSet();
        ProxyFactory factory=new ProxyFactory(new Service(jdbc));factory.setInterfaces(Operations.class);factory.addAdvice(advice);
        proxy=(Operations)factory.getProxy();
    }
    int count(String table) { return jdbc.queryForObject("select count(*) from "+table,Integer.class); }
    @Test void externalCallRollsBackButSelfInvocationDoesNot() {
        assertThrows(IllegalStateException.class,()->proxy.inner());assertEquals(0,count("orders"));
        assertThrows(IllegalStateException.class,()->proxy.outer());assertEquals(1,count("orders"));
    }
    @Test void checkedExceptionsFollowConfiguredRule() {
        assertThrows(Exception.class,()->proxy.checked());assertEquals(1,count("orders"));
        assertThrows(Exception.class,()->proxy.checkedRollback());assertEquals(1,count("orders"));
    }
    @Test void localOrderAndOutboxShareCommitBoundary() {
        TransactionTemplate tx=new TransactionTemplate(manager);
        assertThrows(IllegalStateException.class,()->tx.executeWithoutResult(status->{
            jdbc.update("insert into orders(id) values (4)");jdbc.update("insert into outbox(id) values (4)");
            throw new IllegalStateException("before commit");
        }));
        assertEquals(0,count("orders"));assertEquals(0,count("outbox"));
        tx.executeWithoutResult(status->{jdbc.update("insert into orders(id) values (5)");jdbc.update("insert into outbox(id) values (5)");});
        assertEquals(1,count("orders"));assertEquals(1,count("outbox"));
    }
}
